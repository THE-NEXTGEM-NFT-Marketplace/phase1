import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useAppStore, MarketCategory } from '../../stores/useAppStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from '../ui/use-toast';
import { useWallet, ConnectButton } from "@suiet/wallet-kit";

const proposeMarketSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be less than 500 characters'),
  category: z.enum(['Crypto', 'Politics', 'Sports', 'Community']),
  resolutionDate: z.string().min(1, 'Resolution date is required'),
  initialYesPrice: z.number().min(0.01, 'Initial YES price must be at least 0.01').max(0.99, 'Initial YES price must be less than 0.99'),
});

type ProposeMarketForm = z.infer<typeof proposeMarketSchema>;

export function ProposeMarketView() {
  const { setCurrentView, proposeMarket } = useAppStore();
  const { connected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProposeMarketForm>({
    resolver: zodResolver(proposeMarketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Community',
      resolutionDate: '',
      initialYesPrice: 0.5,
    },
  });

  const onSubmit = async (data: ProposeMarketForm) => {
    if (!connected) {
      toast({
        title: "Wallet Required",
        description: "Please connect a wallet to propose a market.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Validate resolution date is in the future
      const resolutionDate = new Date(data.resolutionDate);
      if (resolutionDate <= new Date()) {
        form.setError('resolutionDate', {
          message: 'Resolution date must be in the future'
        });
        return;
      }

      await proposeMarket({
        title: data.title,
        description: data.description,
        category: data.category,
        resolutionDate,
        initialYesPrice: data.initialYesPrice,
      });

      toast({
        title: "Market Proposed Successfully!",
        description: "Your market has been created and is now live for trading.",
      });

      // Reset form and go back to markets
      form.reset();
      setCurrentView('markets');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to propose market. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView('markets')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Propose New Market
          </CardTitle>
          <CardDescription>
            Create a new prediction market for the community to trade on. Markets require wallet connection and will be reviewed before going live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Will SUI price exceed $5.00 by end of 2025?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide clear resolution criteria and any important details about this market..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Crypto">Crypto</SelectItem>
                          <SelectItem value="Politics">Politics</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Community">Community</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resolutionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolution Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={minDate}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="initialYesPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial YES Price (0.01 - 0.99)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="0.99"
                        placeholder="0.50"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!connected && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive text-sm font-medium">
                    ⚠️ Wallet connection required to propose markets
                  </p>
                  <div className="mt-3"><ConnectButton>Connect Wallet</ConnectButton></div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentView('markets')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !connected}
                  className="flex-1"
                >
                  {isSubmitting ? 'Proposing...' : 'Propose Market'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}